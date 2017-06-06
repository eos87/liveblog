const templates = require('./templates');

class Slideshow {
  constructor() {
    this.start = this.start.bind(this);
    this.keyboardListener = this.keyboardListener.bind(this);
    this.setFocus = this.setFocus.bind(this);
  }

  start(e) {
    let items = [];

    this.iterations = 0;

    e.target
      .closest('article.slideshow')
      .querySelectorAll('.lb-item img')
      .forEach((img) => {
        let matches = [];

        img.getAttribute('srcset').replace(/(\S+)\s\d+w/g, (s, match) => {
          matches.push(match);
        });

        let [baseImage, thumbnail, viewImage] = matches;

        items.push({
          item: {
            meta: {media: {renditions: {
              baseImage: {href: baseImage},
              thumbnail: {href: thumbnail},
              viewImage: {href: viewImage}
            }}},
            active: thumbnail === e.target.getAttribute('src')
          }
        });
      });

    let slideshow = templates.slideshow({
      refs: items
    });

    document.querySelector('div.lb-timeline')
      .insertAdjacentHTML('afterend', slideshow);

    window.addEventListener('keydown', this.keyboardListener);


    this.setFocus();
  }

  setFocus() {
    const container = document.querySelector('#slideshow .container');
    let activeIndex = -1;

    container.querySelectorAll('img').forEach((img, i) => {
      if (img.classList.contains('active')) {
        activeIndex = i;
      }
    });

    if (activeIndex !== -1) {
      container.style.marginTop = `-${container.offsetHeight * activeIndex}px`;
    }
  }

  keyboardListener(e) {
    const container = document.querySelector('#slideshow .container');
    const picturesCount = container.querySelectorAll('img').length;
    let offset = container.offsetHeight * this.iterations;

    switch (e.keyCode) {
    case 39: // right
      if (offset + container.offsetHeight < picturesCount * container.offsetHeight) {
        container.style.marginTop = `-${offset + container.offsetHeight}px`;
        this.iterations++;
      }

      break;
    case 37: // left
      if (offset - container.offsetHeight >= 0) {
        container.style.marginTop = `-${offset - container.offsetHeight}px`;
        this.iterations--;
      }

      break;
    case 27: // esc
      document.querySelector('#slideshow').remove();
    }
  }
}

module.exports = Slideshow;
