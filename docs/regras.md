# Regras em vigor

Origem: o que o dono fechou na conversa e o que `julgar` executa. Sem sinônimo.

- A primeira tela sobe a política. A empresa revisa e aprova o resumo. Sem essa aprovação a nota não entra.
- O PDF não é lido. Nenhuma regra nasce do arquivo.
- O resumo é o que o motor já aplica, não uma leitura do PDF.
- Data e hora de envio e de consumo são gravadas no servidor. A tela não pede e não mostra.
- A nota entra só com a foto. A leitura é da imagem. A tela não pede finalidade.
- Palavra que não está escrita não vira categoria. Padaria não é alimentação.
- Sem hash, a Torita responde `sem_base`. `sem_base` não é suspeita.
- Torita devolve um código só: `limpa`, `duplicada`, `editada`, `repetida`, `fora_do_padrao`, `sem_base`. A frase sai da tabela, não do modelo.
- `duplicada`: mesmo hash, ou mesmo CNPJ, valor e data na mesma empresa.
- `editada`: o arquivo não bate com o hash original.
- `repetida`: mesmo telefone e estabelecimento, fora do intervalo escrito. Sem intervalo, não marca.
- `fora_do_padrao`: valor longe do histórico daquele telefone. Sem histórico, `sem_base`.
- `duplicada` e `editada` barram. Pix não marca.
- `repetida` e `fora_do_padrao` seguem, com o código visível.
- A política só roda se a Torita marcou. Se a fraude não marcou, a política não roda.
- O fiscal só entra se a política aprovou. Se o fiscal falhar, o Pix continua.
- Negada mostra o motivo em destaque. Fraude usa o mesmo lugar. Revisão manual diz quem negou e por quê.
- Contradição ou detalhe que a regra não cobre não vira aprovação.
- Sem data ou sem valor no algoritmo: não lida. No envio da foto, a data de consumo é o relógio do servidor, para a regra poder rodar.
- Táxi convencional não reembolsa. Só Uber, 99, Cabify ou Easy Táxi.
- Café da manhã não reembolsa.
- Almoço só em fim de semana ou feriado, no valor da convenção.
- Jantar a partir de 3 horas após a jornada, com justificativa e aprovação prévia. Teto escrito no motor.
- Estacionamento até o teto escrito, com cupom ou nota e CNPJ.
- Acima do teto fica excedente. Só sai com autorização do VP.
- Pix nesta mesa é marcação. O banco vem depois.
