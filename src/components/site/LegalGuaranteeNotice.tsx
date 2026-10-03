export function LegalGuaranteeNotice() {
  return (
    <div className="my-6 border border-border p-4">
      <p className="mb-3 text-sm font-medium">Garanția legală pentru consumatori</p>
      <p className="mb-3 text-sm leading-relaxed">
        Consumatorii beneficiază de garanția legală de conformitate de minimum doi ani. Dacă un bun
        este neconform, contactează vânzătorul pentru remediile prevăzute de lege. Citește
        notificarea oficială de mai jos pentru detalii.
      </p>
      <a
        href="/legal/garantie-legala-ro.svg"
        target="_blank"
        rel="noreferrer"
        aria-label="Deschide notificarea oficială privind garanția legală, în limba română"
      >
        <img
          src="/legal/garantie-legala-ro.svg"
          alt="Notificarea oficială a Uniunii Europene privind garanția legală de conformitate pentru consumatori"
          className="mx-auto bg-white h-auto w-full max-w-[520px]"
        />
      </a>
      <p className="mt-2 text-center text-sm">
        <a
          className="underline"
          href="/legal/garantie-legala-ro.svg"
          target="_blank"
          rel="noreferrer"
        >
          Deschide notificarea la dimensiune completă
        </a>
      </p>
    </div>
  );
}
