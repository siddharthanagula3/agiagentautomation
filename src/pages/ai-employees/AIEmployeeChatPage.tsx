import React from 'react';
import { useParams } from 'react-router-dom';
import CompleteAIEmployeeChat from '@/components/CompleteAIEmployeeChat';

const AIEmployeeChatPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Employee ID not found</p>
      </div>
    );
  }

  return <CompleteAIEmployeeChat employeeId={employeeId} />;
};

export default AIEmployeeChatPage;
