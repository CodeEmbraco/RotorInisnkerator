function TabLockedScreen({ onForce }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100">
      <div className="max-w-lg mx-4 bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-yellow-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Paletización en uso en otra pestaña
        </h1>
        <p className="text-slate-600 mb-6">
          Esta vista solo puede estar abierta en una pestaña a la vez. Cierra
          la otra pestaña o haz clic abajo si crees que está congelada o quedó
          abierta de una sesión anterior.
        </p>
        <button
          type="button"
          onClick={onForce}
          className="w-full h-12 bg-primary rounded text-white text-base font-medium hover:bg-green-500"
        >
          Forzar control aquí
        </button>
      </div>
    </div>
  );
}

export default TabLockedScreen;
