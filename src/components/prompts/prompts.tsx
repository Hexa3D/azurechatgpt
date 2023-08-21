import React, {useState} from "react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import Papa from "papaparse";

const CSV_URL = "https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/raw/main/prompts.csv"

interface RowType {
    act: string;
    prompt: string;
}

interface DropdownProps {
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
}

export const DropdownWithLazyLoad: React.FC<DropdownProps> = (props) => {

    const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
    const [isMenuOpened, setMenuOpened] = useState(false);

    const [promptsObject] = useState<any>({});

    const fetchCSVData = async () => {
        try {
            const response = await fetch(CSV_URL);

            const csvText = await response.text();

            // parsing CSV text to JSON
            const results = Papa.parse(csvText, {header: true}).data as RowType[];

            // The short description is named as column 'act'
            const options = results.map((row: RowType) => row.act);

            results.forEach((row: RowType) => {
                promptsObject[row.act] = row.prompt;
            })
            setDropdownOptions(options);
        } catch (error) {
            console.error('Error fetching and parsing CSV:', error);
        }
    };

    return (
        <DropdownMenu onOpenChange={async (isOpen) => {
            if (isOpen && !isMenuOpened) {
                await fetchCSVData()
                setMenuOpened(true)
            }
        }}>
            <DropdownMenuTrigger>
                <div style={{
                    cursor: "pointer",
                    backgroundColor: "#F1F5F9",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    borderRadius: "5px"
                }}>Show Options
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent style={{maxHeight: "200px", overflowY: "auto"}}>
                {dropdownOptions.map((option, index) => (
                    <DropdownMenuItem key={index} onSelect={() => {
                        console.log(option);
                        props.setInputValue(promptsObject[option]);}
                    }>
                        {option}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};