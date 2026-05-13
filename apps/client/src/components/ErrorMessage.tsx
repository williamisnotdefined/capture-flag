function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro inesperado";
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  return <p className="mt-3 text-sm font-semibold text-red-700">{getErrorMessage(error)}</p>;
}
