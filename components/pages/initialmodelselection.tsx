import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAllModels, getProviderForModel, getModelByProviderAndMode, aiProviders, Model, getDefaultModels } from '@/config/models';
import Image from 'next/image';

interface InitialModelSelectionProps {
  models: string[];
  setModels: React.Dispatch<React.SetStateAction<string[]>>;
}

const InitialModelSelection: React.FC<InitialModelSelectionProps> = ({ models, setModels }) => {
  const [modelOptions, setModelOptions] = useState<Model[]>([]);

  // Define the fixed provider order
  const providerOrder = ['Anthropic', 'OpenAI', 'Google', 'Together AI'];

  useEffect(() => {
    const loadModels = async () => {
      const models = getAllModels();
      setModelOptions(models);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const savedModels = JSON.parse(localStorage.getItem('selectedModels') || '[]');

    if (savedModels.length > 0) {
      setModels(sortModels(savedModels.slice(0, 3)));
    } else {
      const savedMode = localStorage.getItem('modelMode') as 'fast' | 'smart';
      setModels(getDefaultModels(savedMode || 'fast'));
    }
  }, []);

  const isProviderSelected = (providerName: string) => {
    return models.some(modelId => {
      const provider = getProviderForModel(modelId);
      return provider?.name === providerName;
    });
  };

  // Helper function to sort models based on providerOrder
  const sortModels = (modelsToSort: string[]): string[] => {
    return providerOrder
      .map(providerName => {
        return modelsToSort.find(modelId => {
          const modelProvider = getProviderForModel(modelId);
          return modelProvider?.name === providerName;
        });
      })
      .filter(Boolean) as string[];
  };

  const handleProviderToggle = (providerName: string) => {
    const provider = aiProviders.find(p => p.name === providerName);
    if (!provider) return;

    const isSelected = isProviderSelected(providerName);

    if (isSelected) {
      // Deselect the provider by removing its model from the models array
      setModels(prevModels => {
        const updatedModels = prevModels.filter(modelId => {
          const modelProvider = getProviderForModel(modelId);
          return modelProvider?.name !== providerName;
        });
        // Return sorted models according to providerOrder
        return sortModels(updatedModels);
      });
    } else {
      // Enforce maximum of 3 providers
      if (models.length >= 3) {
        alert('You can select up to 3 AI providers.');
        return;
      }

      // Select the model for the current mode
      const currentMode = (localStorage.getItem('modelMode') as 'fast' | 'smart') || 'fast';
      const model = getModelByProviderAndMode(providerName, currentMode);
      if (model) {
        setModels(prevModels => {
          const updatedModels = [...prevModels, model.id];
          // Return sorted models according to providerOrder
          return sortModels(updatedModels);
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center">
        Select AI Models to Use for ManyAI:
      </h2>
      <div className="flex gap-4 flex-wrap justify-center">
        {providerOrder.map((providerName) => {
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

export default React.memo(InitialModelSelection);
