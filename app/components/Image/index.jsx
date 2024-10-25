export default function Image({ src, ...props }) {
  return <img data-src={src} {...props}></img>
}
