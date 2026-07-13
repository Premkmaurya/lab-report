const waitForReactRender = () => new Promise((resolve) => window.setTimeout(resolve, 150));

const removeExistingPagedOutput = () => {
  document.querySelectorAll('[data-paged-print-output="true"]').forEach((node) => node.remove());
  document.querySelectorAll('.pagedjs_pages').forEach((node) => node.remove());
};

export const handlePrint = async (onBeforePrint, onAfterPrint) => {
  if (onBeforePrint) {
    onBeforePrint();
  }

  await waitForReactRender();

  const source = document.querySelector('.paged-source');

  if (source) {
    removeExistingPagedOutput();

    const { Previewer } = await import('pagedjs');
    const output = document.createElement('div');
    output.setAttribute('data-paged-print-output', 'true');
    output.className = 'paged-print-output';
    document.body.appendChild(output);

    const previewer = new Previewer();
    await previewer.preview(source, [], output);
  }

  window.focus();
  window.print();

  if (onAfterPrint) {
    onAfterPrint();
  }
};
