<!-- PROJECT LOGO -->
<p align="center">
  <h3 align="center">W3Camp</h3>

  <p align="center">
    A simple NodeJS, Express web app
    <br />
    <br />
    <a href="http://w3camp.herokuapp.com/">View App</a>
  </p>
</p>
<br/>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
  </ol>
</details>
<br/>


<!-- ABOUT THE PROJECT -->
## About The Project

W3Camp is a simple web app for finding and sharing interesting camping locations. It was built purely for educational purposes.

The features that it provides are the following:
* Creating and editing an account as well as a profile page.
* Creating and editing campground location objects.
* Viewing campground locations added by other users and commenting on them.
* A forum in which one can create a certain topic or start a discussion on some of the existing ones.

### Built With

* [NodeJS](https://nodejs.org/en/)
* [ExpressJS](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/cloud/atlas)
* [JQuery](https://jquery.com)
* [Bootstrap](https://getbootstrap.com)
* [EJS](https://ejs.co/)


<!-- GETTING STARTED -->
## Getting Started

In order to use this app several API keys are needed.

### Prerequisites

* [Cloudinary](https://cloudinary.com/) - Cloudinary account for storing and accessing all the apps images.
* [DarkSky](https://darksky.net/forecast/40.7127,-74.0059/us12/en) - DarkSky account for weather widget.
* [Gmail](https://gmail.com/) - Gmail account for reset password functionality and contact us page.
* [Google Geocoder API](https://developers.google.com/maps/documentation/geocoding/overview) - For campground location conversion into geographic coordinates.
* [Google Maps API](https://developers.google.com/maps/documentation/android-sdk/get-api-key) - For campground location map.
* [reCAPTCHA v2](https://developers.google.com/recaptcha/docs/display)
* [MongoDB Atlas API](https://www.mongodb.com/cloud/atlas)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/kikooOOoo16/W3Camp.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Enter all of the following API keys as enviroment variables  (`.env` file)
   ```JS
   ADMIN_PASS = 'ENTER YOUR API';
   CLOUDINARY_API_KEY = ''
   CLOUDINARY_API_SECRET = ''
   FORECAST_SECRET_KEY = ''
   GMAIL_ACCOUNT = ''
   GMAIL_PASSWORD = ''
   GOOGLE_GEOCODER_API = ''
   GOOGLE_MAPS_API = ''
   MLAB_DATABASE_URL = ''
   RE_CAPTCHA_SECRET_KEY = ''
   RE_CAPTCHA_SITE_KEY = ''
   ```

<!-- CONTACT -->
## Contact

Kristijan Pavlevski - kristijan.pavlevski@outlook.com

Project Link: [https://github.com/kikooOOoo16/W3Camp](https://github.com/kikooOOoo16/W3Camp)
