export default function Image({ poster, actionRef, ...props }) {
  return <video data-poster={poster} ref={actionRef} {...props}></video>;
}
