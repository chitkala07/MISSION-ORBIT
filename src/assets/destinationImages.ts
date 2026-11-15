import asteroidImg from './images/planet_asteroid_nebula_1794728713391.jpg';
import earthImg from './images/planet_earth_orbit_1794728711326.jpg';
import moonImg from './images/planet_lunar_crater_1794728711977.jpg';
import marsImg from './images/planet_mars_canyon_1794728713022.jpg';

export const DESTINATION_IMAGES: Record<
  'earth' | 'moon' | 'mars' | 'bennu' | 'vesta' | 'sun',
  string
> = {
  earth: earthImg,
  moon: moonImg,
  mars: marsImg,
  bennu: asteroidImg,
  vesta: asteroidImg,
  sun: marsImg,
};
