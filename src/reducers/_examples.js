import baurLogo from 'assets/img/testimonial/testimonials-baur.png'
import empiriecomLogo from 'assets/img/testimonial/testimonials-empiriecom.png'
import suntoursLogo from 'assets/img/testimonial/testimonials-suntours.png'
import fussballdatenLogo from 'assets/img/testimonial/testimonials-fussballdaten.png'
import nectLogo from 'assets/img/testimonial/testimonials-nect.png'

export default function examples() {
  return [
    {
      name: 'Baur',
      id: 'QqWacCbaur',
      logo: baurLogo,
      author: 'Baur',
      position: 'European E-Commerce',
      blockquote: "Speed Kit helps " +
        "<a href='https://www.baur.de' style='text-decoration: underline' target='_blank'>Baur.de</a> " +
        "stay ahead of the competition by accelerating page loads through cutting-edge technology."
    },
    {
      name: 'Suntours',
      id: 'C0Z5aCsuntours',
      logo: suntoursLogo,
      author: 'Christofer Gratz',
      position: 'CEO of Suntours',
      blockquote: 'Speed Kit brought suntours.de from over 2 seconds to less than one second loading time and it was ' +
        'super-easy to set up.'
    },
    {
      name: 'Fussballdaten',
      id: 'j0Bl0Wfussballdaten',
      logo: fussballdatenLogo,
      author: 'Dennis Wedderkop',
      position: 'CEO of Fussballdaten.de',
      blockquote: 'Speed Kit not only makes page loads for Fussballdaten.de twice as fast. Our servers could also ' +
        'handle the notorious end-of-season load peaks with ease. Through the Dynamic Blocks feature, our live ' +
        'tickers are further always up-to-date – it\'s the best of caching, but without staleness!'
    },
    {
      name: 'Empiriecom',
      id: 'QqWacCbaur',
      logo: empiriecomLogo,
      author: 'Empiriecom',
      position: 'E-Commerce Otto Group',
      blockquote: 'The entire Baqend team has impressed us with their exceptional technical prowess, extremely fast ' +
        'response times, and a silky smooth onboarding experience for deploying Speed Kit on Baur.de.'
    },
    {
      name: 'Nect',
      id: 'dxj1k2nect',
      logo: nectLogo,
      author: 'Carlo Ulbrich',
      position: 'CEO of Nect',
      blockquote: 'Other WordPress plugins for web performance are either complex or not effective. ' +
        'Speed Kit is different: It is easy to configure and still shaves a whole second off nect.com load times.'
    },
  ]
}
