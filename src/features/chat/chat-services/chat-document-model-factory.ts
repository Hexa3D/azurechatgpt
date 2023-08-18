import {DocumentModel} from "@azure/ai-form-recognizer";
import {PrebuiltDocumentModel, PrebuiltDocumentResult} from "./chat-document-model";
import {PrebuiltDocumentReadModel} from "./chat-document-read-model";

export const getDocumentModel = function(fileExtension: string) : DocumentModel<PrebuiltDocumentResult> {
    switch (fileExtension) {
        case ".pdf":
            return PrebuiltDocumentModel;
        case ".xls":
        case ".xlsx":
        case ".doc":
        case ".docx":
        case ".ppt":
        case ".pptx":
            return PrebuiltDocumentReadModel;
        default:
            throw new Error("Illegal file format provided: " + fileExtension.replace(".",""));
    }
}