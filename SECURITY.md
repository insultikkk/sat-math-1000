# Политика безопасности / Security Policy

## Поддерживаемая версия

Поддерживается только текущая версия сайта https://insultikkk.github.io/sat-math-1000/ — то, что лежит в ветке `main`. Отдельных выпусков у проекта нет.

## Как сообщить об уязвимости

Если вы нашли уязвимость (доступ к чужим данным, обход правил Firestore, XSS и т. п.):

1. **Не публикуйте детали в открытом Issue.**
2. Сообщите приватно: вкладка **Security** → **Report a vulnerability** в этом репозитории.
   Если эта кнопка недоступна, откройте Issue с заголовком «Security» без технических деталей — с вами свяжутся.
3. Опишите, что именно можно сделать, и шаги, чтобы это воспроизвести.

На сообщение постараемся ответить в течение 7 дней.

## Что считается уязвимостью

- чтение или изменение прогресса другого ученика;
- доступ к админ-панели без прав администратора;
- выполнение чужого кода на странице (XSS).

Публичный ключ `firebaseConfig` в коде уязвимостью не является: это веб-ключ Firebase, он публичный по задумке, а доступ ограничивают правила Firestore.

---

**English:** only the current `main` branch (the live site) is supported. Please report vulnerabilities privately through **Security → Report a vulnerability**, or open an issue titled "Security" without technical details. We aim to respond within 7 days.
