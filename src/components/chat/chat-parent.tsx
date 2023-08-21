import {DropdownWithLazyLoad} from '@/components/prompts/prompts'
import ChatInput from '@/components/chat/chat-input'
import {FC, FormEvent, SetStateAction, useState} from "react";

interface ChatParentProps {
    isLoading: boolean;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    handleInputChange: (e: any) => void;
}

const ChatParent: FC<ChatParentProps> = (props: ChatParentProps) => {

    const [inputValue, setInputValue] = useState('');

    const [rows, setRows] = useState(1);
    const maxRows = 6;

    const [keysPressed, setKeysPressed] = useState(new Set());

    const setRowsToMax = (rows: number) => {
        if (rows < maxRows) {
            setRows(rows + 1);
        }
    };

    const handleInputChange = (e: { target: { value: SetStateAction<string>; }; }) => {
        setInputValue(e.target.value);
        setRowsToMax(e.target.value.toString().split("\n").length - 1);
    }

    const appendInputValue = (newValue: any) => {
        setInputValue(prevValue => `${prevValue}${newValue}`);
        // Set to max rows
        setRowsToMax(maxRows -1);
    }

    return (
        <>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <div className="flex flex-col gap-2 dropdown-prompt">
                    <p className="text-sm text-muted-foreground">
                        Select a prompt for role playing AI (Optional)
                    </p>
                    <DropdownWithLazyLoad setInputValue={appendInputValue}/>
                </div>
                <ChatInput
                    setRows={setRows}
                    maxRows={maxRows}
                    rows={rows}
                    value={inputValue}
                    handleInputChange={handleInputChange}
                    handleSubmit={props.handleSubmit}
                    isLoading={props.isLoading}
                />
            </div>
        </>
    );
};

export default ChatParent;