import React from 'react';

interface StreamingStatusProps {
  streamingModels: string[];
  isFusionLoading: boolean;
  activeButton: string | null;
  hasResponses: boolean;  // Add this prop
}

const StreamingStatus: React.FC<StreamingStatusProps> = ({ 
  streamingModels, 
  isFusionLoading, 
  activeButton,
  hasResponses 
}) => {
  // Only show status if there are responses or models are actively streaming
  if ((streamingModels.length === 0 && !isFusionLoading) || (!hasResponses && isFusionLoading)) return null;

  let statusText = '';

  if (isFusionLoading && streamingModels.length === 0 && hasResponses) {
    statusText = "ManyAI is generating...";
  } else if (streamingModels.length === 1) {
    statusText = `${streamingModels[0]} is thinking...`;
  } else if (streamingModels.length > 1) {
    statusText = `${streamingModels.slice(0, -1).join(', ')} and ${
      streamingModels[streamingModels.length - 1]
    } are thinking...`;
  }

  return statusText ? <div className="streaming-status text-xs text-gray-500">{statusText}</div> : null;
};

export default StreamingStatus;
