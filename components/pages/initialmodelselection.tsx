import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getAllModels, Model, getProviderForModel } from '@/config/models';
import Image from 'next/image';

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
        {[0, 1, 2].map((index) => {
          const selectedModel = modelOptions.find(model => model.id === models[index]);
          const selectedProvider = selectedModel ? getProviderForModel(selectedModel.id) : null;

          return (
            <Card key={index} className="p-4">
              <Select value={models[index]} onValueChange={(value) => handleModelChange(index, value)}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    {selectedProvider && (
                      <Image
                        src={selectedProvider.avatar}
                        alt={`${selectedProvider.nickname} avatar`}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    )}
                    <span>{selectedModel?.displayName}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => {
                    const provider = getProviderForModel(model.id);
                    return (
                      <SelectItem 
                        key={model.id} 
                        value={model.id}
                        className="px-2"
                        disabled={models.includes(model.id) && model.id !== models[index]}
                      >
                        <div className="flex items-center gap-2">
                          {provider && (
                            <Image
                              src={provider.avatar}
                              alt={`${provider.nickname} avatar`}
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                          )}
                          <span>{model.displayName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InitialModelSelection;
