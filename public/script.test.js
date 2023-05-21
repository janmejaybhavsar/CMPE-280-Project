const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
describe('Client Tests', function() {
    let driver;
  
    before(async function() {
      driver = await new Builder().forBrowser('chrome').build();
      await driver.get('http://localhost:3030'); // Replace with the appropriate URL
    });
  
    after(async function() {
      await driver.quit();
    });
  
    it('should toggle audio when mute button is clicked', async function() {
      const muteButton = await driver.findElement(By.id('muteButton'));
      const videoElement = await driver.findElement(By.tagName('video'));
  
      const initialAudioEnabled = await videoElement.getAttribute('muted');
  
      await muteButton.click();
  
      const audioEnabledAfterClick = await videoElement.getAttribute('muted');
      expect(audioEnabledAfterClick).to.equal(initialAudioEnabled === 'true' ? 'false' : 'true');
  
      await muteButton.click();
  
      const audioEnabledAfterSecondClick = await videoElement.getAttribute('muted');
      expect(audioEnabledAfterSecondClick).to.equal(initialAudioEnabled);
    });
  
    // Add more tests for other client-side functionality
  });
  