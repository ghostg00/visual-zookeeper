export const dva = {
  config: {
    onError(err: ErrorEvent) {
      err.preventDefault();
      console.error(err.message);
    },
  },
};
declare global {
  interface Window {
    require(id: string): any;
  }
}
