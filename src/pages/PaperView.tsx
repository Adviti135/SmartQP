import React from 'react';
import { useParams } from 'react-router-dom';

export const PaperView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paper Details: {id}</h1>
      <p className="text-gray-600">This feature is coming soon.</p>
    </div>
  );
};
