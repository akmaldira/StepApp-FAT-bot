const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const { uniqueNamesGenerator, Config, names } = require('unique-names-generator');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

const sendOtp = async (email) => {
    return await axios.get(`https://api.step.app/v1/auth/otp-code?email=${email}`)
    .then(res => res.data)
    .catch(err => console.error(err))
    
}

const getMessageId = async (name, domain) => {
    return await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${name}&domain=${domain}`)
    .then(res => res.data)
    .catch(err => console.error(err))
}

const getMessageBody = async (name, domain, id) => {
    return await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${name}&domain=${domain}&id=${id}`)
    .then(res => res.data)
    .catch(err => console.error(err))
}

const verifyEmail = async (email, otp) => {
    return await axios.get(`https://api.step.app/v1/auth/token?email=${email}&code=${otp}`)
    .then(res => res.data)
    .catch(err => console.error(err))
}

const verifyReff = async (accessToken, refferal) => {
    const body = JSON.stringify({
        referrer: refferal
    })
    const headers = {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Length': body.length,
            'Content-Type': 'application/json'
        }
    }
    return await axios.patch('https://api.step.app/v1/user/me', body, headers)
    .then(res => res.data)
    .catch(err => console.error(err))
}


const main = async (refferal) => {
    const name = uniqueNamesGenerator({
        dictionaries: [names],
        style: 'lowerCase'
    });
    const domain = 'qiott.com';
    console.log(name + '@' + domain);
    const otp = await sendOtp(name + '@' + domain)

    if (otp === 'OK') {
        console.log('OTP Sent');
        const sleep = (milliseconds) => {
            const date = Date.now();
            let currentDate = null;
            do {
              currentDate = Date.now();
            } while (currentDate - date < milliseconds);
        };
        console.log('Checking email verification...');
        while (true) {
            sleep(3000)
            const message = await getMessageId(name, domain)
            if (message.length > 0) {
                if (message[0].subject === 'Email verification') {
                    const messageBody = await getMessageBody(name, domain, message[0].id)
                    const otp = messageBody.body.split('code: ')[1]
                    const verify = await verifyEmail(name + '@' + domain, otp);
                    const accessToken = verify.access.token
                    
                    const reff = await verifyReff(accessToken, refferal)
                    if (reff === 'OK') {
                        console.log(`Success add refferal to refferalId ${refferal} \n`);
                        return name + '@' + domain
                    } else {
                        console.log('Error while verify refferal \n');
                        return null
                    }
                }
            }
            console.log('OTP not found, waiting 3 sec');
        }
    } else {
        console.log('Error sending OTP');
    }
}

const ask = msg => new Promise(resolve => 
    rl.question(msg, response => resolve(response))
);

rl.question('Refferal : ', function (refferal) {
    rl.question('How much : ', async function (x) {
        var loop = parseInt(x) - 1;
        for (let i = 0; i <= loop; i++) {
            await main(refferal)
            .then((res) => {
                if (res !== null) {
                    const content = res
                    fs.writeFile('result.txt', content, err => {
                        if (err) {
                          console.error(err);
                        }
                    });
                }
            })
        }
        rl.close();
    });
});