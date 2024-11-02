import GTM from "./GTM";

export default function Head({ logoLink }) {
  return (
    <head>
      {/* website Logo */}
      <link rel="icon" href={logoLink} />
      {/* Google GTM */}
      <GTM />
      {/* image loading */}
      <style>{`
          img {
            &[data-src], &[data-loading] {
              background-image: url('${logoLink}');
            }
          }
        `}</style>
    </head>
  );
}
