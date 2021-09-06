const { google } = require('googleapis');
const https = require('https');
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

// REQUISIÇÃO DA API FUTEBOL PARA TRAZER JOGOS DO PALMEIRAS

const url = "https://api.api-futebol.com.br/v1/times/56/partidas/proximas";
const authorization = "test_242b69849c16946018763395b39658";

const options = {
    headers: {
        'Authorization': 'Bearer ' + authorization
    }
}


// Chamada MOCK - TIRAR DO MÉTODO DE REQUISIÇÃO
//const jogos = require('./jogos.json');


https.get(url, options, res => {

    let data = "";

    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {
        let jogos = JSON.parse(data);

        // SEPARA OS CAMPEONATOS
        let uniao_todos_jogos = [];
        let jogos_pameiras = [];

        if (jogos['campeonato-brasileiro'] != undefined) {
            uniao_todos_jogos.push(jogos['campeonato-brasileiro']);
        }
        if (jogos['copa-libertadores-da-america'] != undefined) {
            uniao_todos_jogos.push(jogos['copa-libertadores-da-america']);
        }
        if (jogos['campeonato-paulista'] != undefined) {
            uniao_todos_jogos.push(jogos['campeonato-paulista']);
        }
        if (jogos['copa-do-brasil'] != undefined) {
            uniao_todos_jogos.push(jogos['copa-do-brasil']);
        }

        // UNIÃO DOS CAMPEONATOS
        for (let i = 0; i < uniao_todos_jogos.length; i++) {
            for (let j = 0; j < uniao_todos_jogos[i].length; j++) {
                jogos_pameiras.push(uniao_todos_jogos[i][j]);
            }
        }

        let quantidade_jogos = Object.keys(jogos_pameiras).length;

        // LAÇO DE INSERÇÃO NO GOOGLE AGENDA
        for (let i = 0; i < quantidade_jogos; i++) {

            if (jogos_pameiras[i]['data_realizacao_iso'] != null) {
                let end_date_timeoffset = jogos_pameiras[i]['data_realizacao_iso'];
                let end_date_no_timeoffset = end_date_timeoffset.replace("00-0300", "00.000");
                let date = new Date(end_date_no_timeoffset + '+00:00');
                date.setHours(date.getHours() + 2);
                let end_date = date.toISOString().replace("00.000Z", "00-0300");

                //VERIFICA SE JÁ EXISTE AGENDAMENTO NAQUELE HORÁRIO E FAZ O AGENDAMENTO
                getEvents(jogos_pameiras[i]['data_realizacao_iso'], end_date)
                    .then((res) => {

                        let retorno_verifica_evento_criado = res;
                        if (retorno_verifica_evento_criado == null || retorno_verifica_evento_criado == 0) {

                            // ATRIBUI EVENTO 
                            let event = {
                                'summary': jogos_pameiras[i]['placar'],
                                //'description': `This is the description.`,
                                'location': jogos_pameiras[i]['estadio']['nome_popular'],
                                'start': {
                                    //'dateTime': dateTime['start'],
                                    'dateTime': jogos_pameiras[i]['data_realizacao_iso'],
                                    'timeZone': 'America/Sao_Paulo'
                                },
                                'end': {
                                    //'dateTime': dateTime['end'],
                                    'dateTime': end_date,
                                    'timeZone': 'America/Sao_Paulo'
                                }
                            };

                            // INSERE EVENTO
                            insertEvent(event)
                                .then((res) => {
                                    if (res === 1) {
                                        console.log('\nJogo: ' + jogos_pameiras[i]['placar']);
                                        console.log('Data do Jogo: ' + jogos_pameiras[i]['data_realizacao_iso']);
                                        console.log('Estádio: ' + jogos_pameiras[i]['estadio']['nome_popular'] + '\n');
                                        console.log('----------------');
                                    }
                                })
                                .catch((err) => {
                                    console.log(err);
                                });

                        }

                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }

        }


    }).on("error", (err) => {
        console.log("Erro na requisição: " + err.message);
    });
});



// Insert new event to Google Calendar
const insertEvent = async (event) => {

    try {
        let response = await calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: event
        });

        if (response['status'] == 200 && response['statusText'] === 'OK') {
            return 1;
        } else {
            return 0;
        }
    } catch (error) {
        console.log(`Error at insertEvent --> ${error}`);
        return 0;
    }
};

// // Get all the events between two dates
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



// let start = '2021-09-12T16:00:00-03:00';
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

// let eventId = 'ksfgcuj8pusupghli4686i8pdg';

// deleteEvent(eventId)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });