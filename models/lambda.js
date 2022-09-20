const https = require('https');
require("dotenv").config();

function getRequest() {
  const url = process.env.API_ENDPOINT;

  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(new Error(e));
        }
      });
    });

    req.on('error', err => {
      reject(new Error(err));
    })
  });
}

function postRequest(body) {
  const options = {
    host: process.env.API_HOST,
    path: process.env.API_PATH,
    method: 'POST',
    port: 443,
    headers: {
      'Content-Type': 'application/json'
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      })

      res.on('end', () => {
        try {
          console.log(rawData);
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(new Error(e));
        }
      });
    });

    req.write(body);
    req.end();

    req.on('error', err => {
      reject(new Error(err));
    })
  })
}


exports.gethandler = async () => {
  try {
    const result = await getRequest();
    console.log('result is: ', result);

    return {
      statusCode: 200,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log('Error is: ', error);
    return {
      statusCode: 400,
      body: error.message,
    };
  }
}

exports.posthandler = async (body) => {
  try {
    const result = await postRequest(body);
    console.log('result is: ', result);

    return {
      statusCode: 200,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log('Error is: ', error);
    return {
      statusCode: 400,
      body: error.message,
    };
  }
}
