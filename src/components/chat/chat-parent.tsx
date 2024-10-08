import {DropdownWithLazyLoad} from '@/components/prompts/prompts'
import ChatInput from '@/components/chat/chat-input'
import {FC, FormEvent, useState} from "react";
import {Message} from "ai";

interface ChatParentProps {
    isLoading: boolean;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    handleInputChange: (e: any) => void;
    value: string;
    messages: Message[];
}

const ChatParent: FC<ChatParentProps> = (props: ChatParentProps) => {

    // let selectedValue: string | null = null;

    const [dropdownVisible, setDropdownVisible] = useState(true);

    const [rows, setRows] = useState(1);
    const maxRows = 6;

    const setRowsToMax = (rows: number) => {
        if (rows < maxRows) {
            setRows(rows + 1);
        }
    };

    const appendInputValue = (newValue: any) => {
        props.handleInputChange({
            target: {
                value: newValue
            }
        });
        setDropdownVisible(false);
        setRowsToMax(maxRows - 1);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        props.handleSubmit(e);  // call parent handleSubmit
        setDropdownVisible(false); // hide dropdown after form submit
    }

    return (
        <>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                {!props.messages.length && dropdownVisible && <div className="flex flex-col gap-2 dropdown-prompt">
                    <p className="text-sm text-muted-foreground">
                        Select a prompt for role playing AI (Optional)
                    </p>
                    <DropdownWithLazyLoad setInputValue={appendInputValue}/>
                </div>}
                <ChatInput
                    setRows={setRows}
                    maxRows={maxRows}
                    rows={rows}
                    value={props.value}
                    handleInputChange={props.handleInputChange}
                    handleSubmit={handleSubmit}
                    isLoading={props.isLoading}
                />
            </div>
        </>
    );
};

export default ChatParent;