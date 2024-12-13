import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllModels, Model, getProviderForModel, aiProviders } from '@/config/models';
import Image from 'next/image';

interface InitialModelSelectionProps {
  models: string[];
  handleModelChange: (index: number, value: string) => void;
}

const InitialModelSelectionComponent: React.FC<InitialModelSelectionProps> = ({ models, handleModelChange }) => {
  const [modelOptions, setModelOptions] = useState<Model[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      const models = getAllModels();
      setModelOptions(models);
    };
    loadModels();
  }, []);

  const isProviderSelected = (providerName: string) => {
    return models.some(modelId => {
      const provider = getProviderForModel(modelId);
      return provider?.name === providerName;
    });
  };

  const handleProviderToggle = (providerName: string) => {
    const provider = aiProviders.find(p => p.name === providerName);
    if (!provider) return;

    const currentIndex = models.findIndex(modelId => {
      const modelProvider = getProviderForModel(modelId);
      return modelProvider?.name === providerName;
    });

    if (currentIndex === -1) {
      // Find first available slot
      const emptyIndex = models.findIndex(model => !model);
      if (emptyIndex !== -1) {
        // Select the first enabled model from this provider
        const firstEnabledModel = provider.models.find(m => m.enabled);
        if (firstEnabledModel) {
          handleModelChange(emptyIndex, firstEnabledModel.id);
        }
      }
    } else {
      // Deselect by setting empty string
      handleModelChange(currentIndex, '');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center">
        Select AI Models to Use for ManyAI:
      </h2>
      <div className="flex gap-4 flex-wrap justify-center">
        {['Anthropic', 'OpenAI', 'Google'].map((providerName) => {
          const provider = aiProviders.find(p => p.name === providerName);
          const isSelected = isProviderSelected(providerName);

          return (
            <Button
              key={providerName}
              onClick={() => handleProviderToggle(providerName)}
              className={`
                flex items-center gap-2 px-4 py-2 min-w-[120px]
                bg-white
                ${isSelected 
                  ? 'border-1.5 border-gray-200 text-black bg-gray-50 hover:bg-gray-100' 
                  : 'border border-gray-100 text-gray-400 bg-gray-0 hover:bg-gray-50'
                }
                transition-all duration-200
              `}
            >
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="gray"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {provider && (
                <>
                  <Image
                    src={provider.avatar}
                    alt={`${provider.nickname} avatar`}
                    width={20}
                    height={20}
                    className={`rounded-full ${!isSelected ? 'opacity-75' : ''}`}
                  />
                  <span className="mr-2">{provider.nickname}</span>
                </>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

InitialModelSelectionComponent.displayName = 'InitialModelSelection';

const InitialModelSelection = React.memo(InitialModelSelectionComponent);
InitialModelSelection.displayName = 'InitialModelSelection';

export default InitialModelSelection;
