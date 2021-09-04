const { google } = require('googleapis');
const jogos = require('./jogos.json');
require('dotenv').config();

// Provide the required configuration
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
const calendarId = process.env.CALENDAR_ID;

// Google calendar API settings
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const calendar = google.calendar({ version: "v3" });

const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
);

console.log(jogos['campeonato-brasileiro'].length);
const brasileirao = jogos['campeonato-brasileiro'];
//const jogo1 = jogos['campeonato-brasileiro'][0];
//console.log(jogo1.partida_id);

// Insert new event to Google Calendar
const insertEvent = async (event) => {

    try {
        let response = await calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: event
        });

        if (response['status'] == 200 && response['statusText'] === 'OK') {
            console.log(`ID do evento --> ${response['data']['id']}`);
            return 1;
        } else {
            return 0;
        }
    } catch (error) {
        console.log(`Error at insertEvent --> ${error}`);
        return 0;
    }
};

//let dateTime = dateTimeForCalander();

//console.log(dateTimeForCalander());

for (let i = 0; i < brasileirao.length; i++) {

    if (brasileirao[i]['data_realizacao_iso'] != null) {
        let end_date_timeoffset = brasileirao[i]['data_realizacao_iso'];
        let end_date_no_timeoffset = end_date_timeoffset.replace("00-0300", "00.000");
        let date = new Date(end_date_no_timeoffset + '+00:00');
        date.setHours(date.getHours() + 2);
        let end_date = date.toISOString().replace("00.000Z", "00-0300");

        console.log(
            `Jogo: ${brasileirao[i]['placar']} 
        Inicio: ${brasileirao[i]['data_realizacao_iso']}
        Fim: ${end_date} 
        Estádio: ${brasileirao[i]['estadio']['nome_popular']}`);

        // Event for Google Calendar
        let event = {
            'summary': brasileirao[i]['placar'],
            //'description': `This is the description.`,
            'location': brasileirao[i]['estadio']['nome_popular'],
            'start': {
                //'dateTime': dateTime['start'],
                'dateTime': brasileirao[i]['data_realizacao_iso'],
                'timeZone': 'America/Sao_Paulo'
            },
            'end': {
                //'dateTime': dateTime['end'],
                'dateTime': end_date,
                'timeZone': 'America/Sao_Paulo'
            }
        };

        insertEvent(event)
            .then((res) => {
                console.log(res);
            })
            .catch((err) => {
                console.log(err);
            });

    }

}

// Get all the events between two dates
const getEvents = async (dateTimeStart, dateTimeEnd) => {

    try {
        let response = await calendar.events.list({
            auth: auth,
            calendarId: calendarId,
            timeMin: dateTimeStart,
            timeMax: dateTimeEnd,
            timeZone: 'America/Sao_Paulo'
        });

        let items = response['data']['items'];
        return items;
    } catch (error) {
        console.log(`Error at getEvents --> ${error}`);
        return 0;
    }
};

// let start = '2021-09-12T04:00:00-03:00';
// let end = '2021-09-12T18:00:00-03:00';

// getEvents(start, end)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

// Delete an event from eventID
const deleteEvent = async (eventId) => {

    try {
        let response = await calendar.events.delete({
            auth: auth,
            calendarId: calendarId,
            eventId: eventId
        });

        if (response.data === '') {
            return 1;
        } else {
            return 0;
        }
    } catch (error) {
        console.log(`Error at deleteEvent --> ${error}`);
        return 0;
    }
};

// let eventId = 'g2bnknov8atmqg0486eoflo9uo';

// deleteEvent(eventId)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });