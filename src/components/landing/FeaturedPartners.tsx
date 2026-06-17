import paystackLogo from '@/assets/paystack.svg';
import opayLogo from '@/assets/opay.png';

const FeaturedPartners = () => {
  return (
    <section
      className="border-y border-slate-100 bg-white py-8 sm:py-10"
      aria-labelledby="featured-partners-heading"
    >
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2
          id="featured-partners-heading"
          className="mb-6 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 sm:mb-8 sm:text-xs"
        >
          OUR PARTNERS
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 md:gap-24">
          <a
            href="https://paystack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-90 transition-opacity duration-300 hover:opacity-100"
            aria-label="Paystack"
          >
            <img src={paystackLogo} alt="" className="h-7 w-auto sm:h-8" />
          </a>
          <a
            href="https://opayweb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-90 transition-opacity duration-300 hover:opacity-100"
            aria-label="OPay"
          >
            <img src={opayLogo} alt="" className="h-8 w-auto object-contain sm:h-10" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPartners;
