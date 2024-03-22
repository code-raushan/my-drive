import moment from 'moment';

export function getDateAsString(): string {
  return moment().format('Do MMMM YYYY');
}
export function convertDateAsString(date: string): string {
  return moment(date).format('Do MMMM YYYY');
}

export function isCurrentDateBeforeDate(givenDate: string): boolean {
  return (new Date()).setHours(0, 0, 0, 0) <= new Date(givenDate).setHours(0, 0, 0, 0);
}

export function getDate(defaultDate?: string): string {
  let dateObj;

  if (defaultDate) {
    dateObj = new Date(defaultDate);
  } else {
    dateObj = new Date();
  }

  const year = dateObj.getFullYear().toString();
  const month = (dateObj.getMonth() + 1).toString();
  const date = dateObj.getDate().toString();

  let updatedMonth = month;
  if (month.length == 1) {
    updatedMonth = '0';
    updatedMonth += month;
  }

  let updatedDate = date;
  if (date.length == 1) {
    updatedDate = '0';
    updatedDate += date;
  }
  return year + '-' + updatedMonth + '-' + updatedDate;
}

export function getDateInDDMMYYYY(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth() + 1; // Months start at 0!
  const dd = today.getDate();
  let date = dd.toString();
  let month = mm.toString();
  if (dd < 10) date = '0' + dd;
  if (mm < 10) month = '0' + mm;
  const formattedToday = date + '/' + month + '/' + yyyy;
  return formattedToday;
}