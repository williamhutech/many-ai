import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getAllModels, Model } from '@/config/models';

interface InitialModelSelectionProps {
  models: string[];
  handleModelChange: (index: number, value: string) => void;
}

const InitialModelSelection: React.FC<InitialModelSelectionProps> = ({ models, handleModelChange }) => {
  const [modelOptions, setModelOptions] = useState<Model[]>([]);

  useEffect(() => {
    setModelOptions(getAllModels());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center">
        Start by Selecting the Models You&apos;d like to Use:
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {[0, 1, 2].map((index) => (
          <Card key={index} className="p-4">
            <Select value={models[index]} onValueChange={(value) => handleModelChange(index, value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InitialModelSelection;
