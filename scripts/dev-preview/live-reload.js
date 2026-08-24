(() => {
  const source = new EventSource('/__dev/events');
  source.onmessage = () => {
    source.close();
    location.reload();
  };
})();
