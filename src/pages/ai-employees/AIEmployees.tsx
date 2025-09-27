import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompleteAIEmployeeMarketplace from '@/components/CompleteAIEmployeeMarketplace';
import CompleteAdminDashboard from '@/components/CompleteAdminDashboard';

const AIEmployees: React.FC = () => {
  const [activeTab, setActiveTab] = useState('marketplace');

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace" className="h-full">
          <CompleteAIEmployeeMarketplace />
        </TabsContent>
        
        <TabsContent value="dashboard" className="h-full">
          <CompleteAdminDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIEmployees;
