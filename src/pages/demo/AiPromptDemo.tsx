import { PromptInputBox } from "@/components/ui/ai-prompt-box";

const AiPromptDemo = () => {
  const handleSendMessage = (message: string, files?: File[]) => {
    console.log("Message:", message);
    console.log("Files:", files);
  };
  return (
    <div className="flex w-full h-screen justify-center items-center bg-[radial-gradient(125%_125%_at_50%_101%,rgba(245,87,2,1)_10.5%,rgba(245,120,2,1)_16%,rgba(245,140,2,1)_17.5%,rgba(245,170,100,1)_25%,rgba(238,174,202,1)_40%,rgba(202,179,214,1)_65%,rgba(148,201,233,1)_100%)]">
      <div className="p-4 w-[500px]">
        <PromptInputBox onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default AiPromptDemo;


