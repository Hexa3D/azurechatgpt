"use server";

import path from "path";
import {userHashedId} from "@/features/auth/helpers";
import {initDBContainer} from "@/features/common/cosmos";
import {AzureCogSearch} from "@/features/langchain/vector-stores/azure-cog-search/azure-cog-vector-store";
import {AzureKeyCredential, DocumentAnalysisClient, DocumentModel} from "@azure/ai-form-recognizer";
import {ComputerVisionClient} from "@azure/cognitiveservices-computervision";
import {CognitiveServicesCredentials} from "@azure/ms-rest-azure-js";
import {Document} from "langchain/document";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {nanoid} from "nanoid";
import {CHAT_DOCUMENT_ATTRIBUTE, ChatDocumentModel, FaqDocumentIndex,} from "./models";
import {PrebuiltDocumentResult} from "@/features/chat/chat-services/chat-document-model";
import {getDocumentModel} from "@/features/chat/chat-services/chat-document-model-factory";
import {DescribeImageInStreamResponse} from "@azure/cognitiveservices-computervision/esm/models";


const MAX_DOCUMENT_SIZE = 100000000;

export const UploadDocument = async (formData: FormData) => {
  const { docs, file, chatThreadId } = await LoadFile(formData);
  const splitDocuments = await SplitDocuments(docs);
  const docPageContents = splitDocuments.map((item) => item.pageContent);
  await IndexDocuments(file, docPageContents, chatThreadId);
  return file.name;
};

const LoadFile = async (formData: FormData) => {
  const file: File | null = formData.get("file") as unknown as File;
  const chatThreadId: string = formData.get("id") as unknown as string;

  if (file && file.size < MAX_DOCUMENT_SIZE) {
    const blob = new Blob([file], { type: file.type });

    const fileExtension = path.extname(file.name);

    // Results will be held in this list
    const docs: Document[] = [];

    // Check if it's an image
    if ([".png", ".jpg", ".jpeg"].includes(fileExtension)) {
      const client = initImageIntelligence();

      const response : DescribeImageInStreamResponse = await client.describeImageInStream(
          await blob.arrayBuffer()
      );

      if (response.captions) {
        for (const caption of response.captions) {
          const doc: Document = {
            pageContent: caption.text ? caption.text : "Cannot identify the image",
            metadata: {
              file: file.name,
            },
          };
          docs.push(doc);
        }
      }

    } else {
      const client = initDocumentIntelligence();

      const documentModel : DocumentModel<PrebuiltDocumentResult> = getDocumentModel(fileExtension);

      const poller = await client.beginAnalyzeDocument(
          documentModel,
          await blob.arrayBuffer()
      );

      const { paragraphs } = await poller.pollUntilDone();

      if (paragraphs) {
        for (const paragraph of paragraphs) {
          const doc: Document = {
            pageContent: paragraph.content,
            metadata: {
              file: file.name,
            },
          };
          docs.push(doc);
        }
      } else {
        throw new Error("No content found in document.");
      }
    }

    return { docs, file, chatThreadId };
  }
  throw new Error("Invalid file format or size. Only PDF files are supported.");
};

const SplitDocuments = async (docs: Array<Document>) => {
  const allContent = docs.map((doc) => doc.pageContent).join("\n");
  const splitter = new RecursiveCharacterTextSplitter();
  const output = await splitter.createDocuments([allContent]);
  return output;
};

const IndexDocuments = async (
  file: File,
  docs: string[],
  chatThreadId: string
) => {
  const vectorStore = initAzureSearchVectorStore();
  const documentsToIndex: FaqDocumentIndex[] = [];
  let index = 0;
  for (const doc of docs) {
    const docToAdd: FaqDocumentIndex = {
      id: 'id' + nanoid(),
      chatThreadId,
      user: await userHashedId(),
      pageContent: doc,
      metadata: file.name,
      embedding: [],
    };

    documentsToIndex.push(docToAdd);
    index++;
  }

  await vectorStore.addDocuments(documentsToIndex);
  await UpsertChatDocument(file.name, chatThreadId);
};

export const initAzureSearchVectorStore = () => {
  const embedding = new OpenAIEmbeddings();
  const azureSearch = new AzureCogSearch<FaqDocumentIndex>(embedding, {
    name: process.env.AZURE_SEARCH_NAME,
    indexName: process.env.AZURE_SEARCH_INDEX_NAME,
    apiKey: process.env.AZURE_SEARCH_API_KEY,
    apiVersion: process.env.AZURE_SEARCH_API_VERSION,
    vectorFieldName: "embedding",
  });

  return azureSearch;
};

export const initDocumentIntelligence = () => {
  return new DocumentAnalysisClient(
      process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY)
  );
};

export const initImageIntelligence = () => {
  if (!process.env.AZURE_IMAGE_INTELLIGENCE_ENDPOINT || !process.env.AZURE_IMAGE_INTELLIGENCE_KEY) {
    throw new Error("Azure Image Intelligence Endpoint and Key are required.");
  }
  return new ComputerVisionClient(
      new CognitiveServicesCredentials(process.env.AZURE_IMAGE_INTELLIGENCE_KEY),
      process.env.AZURE_IMAGE_INTELLIGENCE_ENDPOINT
  );
}

export const UpsertChatDocument = async (
  fileName: string,
  chatThreadID: string
) => {
  const modelToSave: ChatDocumentModel = {
    chatThreadId: chatThreadID,
    id: 'id' + nanoid(),
    userId: await userHashedId(),
    createdAt: new Date(),
    type: CHAT_DOCUMENT_ATTRIBUTE,
    isDeleted: false,
    name: fileName,
  };

  const container = await initDBContainer();
  await container.items.upsert(modelToSave);
};
