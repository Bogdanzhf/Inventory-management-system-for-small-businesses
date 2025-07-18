# Ресурсы проекта

Эта директория содержит статические ресурсы, используемые в проекте.

## Структура

- `images/` - изображения, используемые в проекте
  - `logo.svg` - логотип приложения
  - `icons/` - иконки
  - `backgrounds/` - фоновые изображения
- `fonts/` - шрифты
- `styles/` - общие стили, не связанные с компонентами

## Использование изображений

Изображения можно импортировать в компоненты следующим образом:

```tsx
import logo from '../assets/images/logo.svg';

const MyComponent = () => {
  return <img src={logo} alt="Логотип" />;
};
```

## Использование шрифтов

Шрифты подключаются в файле `index.scss`:

```scss
@font-face {
  font-family: 'CustomFont';
  src: url('../assets/fonts/CustomFont.woff2') format('woff2'),
       url('../assets/fonts/CustomFont.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}
```

## Добавление новых ресурсов

При добавлении новых ресурсов, пожалуйста, следуйте установленной структуре директорий и соглашениям по именованию файлов. 