import React from 'react';

interface StreamingStatusProps {
  streamingModels: string[];
  isFusionLoading: boolean;
  activeButton: string | null;
}

const StreamingStatus: React.FC<StreamingStatusProps> = ({ streamingModels, isFusionLoading, activeButton }) => {
  if (streamingModels.length === 0 && !isFusionLoading) return null;

  let statusText = '';

  if (isFusionLoading) {
    statusText = `${activeButton} Agent is thinking...`;
  } else if (streamingModels.length === 1) {
    statusText = `${streamingModels[0]} is thinking...`;
  } else {
    statusText = `${streamingModels.slice(0, -1).join(', ')} and ${
      streamingModels[streamingModels.length - 1]
    } are thinking...`;
  }

  return <div className="text-xs text-gray-500">{statusText}</div>;
};

export default StreamingStatus;
