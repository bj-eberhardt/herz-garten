with descriptions(key, description) as (
  values
    ('notifications.titles.dailyAnswerWaiting', 'Benachrichtigungstitel: Antwort wartet'),
    ('notifications.titles.dailyRevealed', 'Benachrichtigungstitel: Tagesfrage freigeschaltet'),
    ('notifications.titles.questWaitingConfirmation', 'Benachrichtigungstitel: Aufgabe wartet auf Bestaetigung'),
    ('notifications.titles.questCompleted', 'Benachrichtigungstitel: Aufgabe abgeschlossen'),
    ('notifications.titles.loveJarNote', 'Benachrichtigungstitel: Liebesglas-Zettel'),
    ('notifications.titles.memoryCreated', 'Benachrichtigungstitel: Erinnerung erstellt'),
    ('notifications.titles.knowMeQuestion', 'Benachrichtigungstitel: Kennst-du-mich-Frage'),
    ('notifications.titles.knowMeAnsweredHit', 'Benachrichtigungstitel: Kennst-du-mich richtig geraten'),
    ('notifications.titles.knowMeAnsweredMiss', 'Benachrichtigungstitel: Kennst-du-mich falsch geraten'),
    ('notifications.titles.coupleDisconnected', 'Benachrichtigungstitel: Paarung getrennt'),
    ('notifications.bodies.dailyAnswerWaiting', 'Benachrichtigungstext: Antwort wartet'),
    ('notifications.bodies.dailyRevealed', 'Benachrichtigungstext: Tagesfrage freigeschaltet'),
    ('notifications.bodies.questWaitingConfirmation', 'Benachrichtigungstext: Aufgabe wartet auf Bestaetigung'),
    ('notifications.bodies.questCompleted', 'Benachrichtigungstext: Aufgabe abgeschlossen'),
    ('notifications.bodies.loveJarNote', 'Benachrichtigungstext: Liebesglas-Zettel'),
    ('notifications.bodies.memoryCreated', 'Benachrichtigungstext: Erinnerung erstellt'),
    ('notifications.bodies.knowMeQuestion', 'Benachrichtigungstext: Kennst-du-mich-Frage'),
    ('notifications.bodies.knowMeAnsweredHit', 'Benachrichtigungstext: Kennst-du-mich richtig geraten'),
    ('notifications.bodies.knowMeAnsweredMiss', 'Benachrichtigungstext: Kennst-du-mich falsch geraten'),
    ('notifications.bodies.coupleDisconnected', 'Benachrichtigungstext: Paarung getrennt')
)
update message_templates template
set description = descriptions.description,
    updated_at = now()
from descriptions
where template.key = descriptions.key;
