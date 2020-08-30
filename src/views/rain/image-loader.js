
export async function getImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image)
    };
    image.onerror = (e) => {
      reject(e)
    };
    image.src = src;
  })
}

export default getImage;