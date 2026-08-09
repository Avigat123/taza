import greenApple from "../assets/produce/green_apple.jpg";
import blueberry from "../assets/produce/bluebarry.jpg";
import mango from "../assets/produce/mango.jpg";
import tomato from "../assets/produce/tomato.jpg";
import apple from "../assets/produce/apple.jpg";
import orange from "../assets/produce/orange.png";
import papaya from "../assets/produce/papaya.png";
import fruits from "../assets/produce/fruits.png";
import banana from "../assets/produce/banana.png";
// Maps a produce name (as used in batch data) to its real photo.
// Add an entry here whenever a new photo is dropped into
// src/assets/produce/ — every thumbnail spot in the app reads from
// this one place, so nothing else needs to change.
export const PRODUCE_IMAGES = {
  Mango: mango,
  Tomato: tomato,
  Apple: apple,
  "Green Apple": greenApple,
  Blueberry: blueberry,
  Orange: orange,
  Papaya: papaya,
  Fruits: fruits,
  Banana: banana,
};

// Full set, used for decorative galleries/backgrounds.
export const PRODUCE_GALLERY = [
  { name: "Green Apple", src: greenApple },
  { name: "Blueberry", src: blueberry },
  { name: "Mango", src: mango },
  { name: "Tomato", src: tomato },
  { name: "Apple", src: apple },
  { name: "Orange", src: orange },
  { name: "Papaya", src: papaya },
  { name: "Banana", src: banana },
  { name: "Fruits", src: fruits },

];

export function getProduceImage(produceName) {
  return PRODUCE_IMAGES[produceName] || null;
}
