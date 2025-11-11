import React from 'react';

const ApiReference: React.FC = () => {
  return (
    <section className="py-12">
      <h1 className="mb-4 text-3xl font-bold">API Reference</h1>
      <p className="mb-4 text-muted-foreground">
        Explore our API endpoints, types, and examples.
      </p>
      <a
        href="https://docs.mgx.dev/"
        target="_blank"
        rel="noreferrer"
        className="text-primary underline"
      >
        View API Docs
      </a>
    </section>
  );
};

export default ApiReference;
