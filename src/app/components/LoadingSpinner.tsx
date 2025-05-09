export default function LoadingSpinner() {
    return (
      <div className="text-center my-8">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">
          Generating your logo...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This may take up to 30 seconds.
        </p>
      </div>
    );
  }