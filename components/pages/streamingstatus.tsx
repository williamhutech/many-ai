import React from 'react';

interface StreamingStatusProps {
  streamingModels: string[];
}

const StreamingStatus: React.FC<StreamingStatusProps> = ({ streamingModels }) => {
  if (streamingModels.length === 0) return null;

  const statusText =
    streamingModels.length === 1
      ? `${streamingModels[0]} is thinking...`
      : `${streamingModels.slice(0, -1).join(', ')} and ${
          streamingModels[streamingModels.length - 1]
        } are thinking...`;

  return <div className="text-xs text-gray-500 mb-4">{statusText}</div>;
};

export default StreamingStatus;

