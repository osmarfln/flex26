const html = `RIO
6 SORTEIOS
RIO
PPT 09h
HOJE
1º PRÊMIO
5953
GATO
GRUPO 14 🐱
2º
G11
2243
CAVALO
3º
G01
4303
AVESTRUZ`;

const schedules = [{ type: 'PPT', time: '09:20' }];
schedules.forEach(schedule => {
  const regex = new RegExp(\`\${schedule.type}.*?1º PRÊMIO.*?(\\\\d{4})\\\\s+([A-ZÇÃÊÍÓÚ-]+)\\\\s+GRUPO\\\\s+(\\\\d{2})\`, 'si');
  const match = html.match(regex);
  console.log('Schedule:', schedule.type);
  console.log('Match:', match ? match[1] + ' ' + match[2] + ' ' + match[3] : 'No match');
});
