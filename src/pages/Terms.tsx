import TermsContent from "../components/legal/TermsContent";

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="card p-5">
        <p className="page-kicker">Libota</p>
        <h1 className="page-title mt-2">Conditions d'utilisation</h1>
      </div>
      <div className="card p-5 sm:p-6">
        <TermsContent />
      </div>
    </div>
  );
}
