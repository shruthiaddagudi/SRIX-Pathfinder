export default function LiveRegion({
  message,
}: {
  message: string;
}) {
  if (!message) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
