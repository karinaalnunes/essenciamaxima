import { format } from "date-fns";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
}

const formatToICSDate = (date: Date): string => {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
};

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

export const generateICS = (meeting: Meeting): string => {
  const startDate = new Date(meeting.scheduled_at);
  const endDate = addMinutes(startDate, meeting.duration_minutes);
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Máxima iA//Reunião//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${meeting.id}@maximaia.com
DTSTAMP:${formatToICSDate(new Date())}
DTSTART:${formatToICSDate(startDate)}
DTEND:${formatToICSDate(endDate)}
SUMMARY:${meeting.title}
DESCRIPTION:${meeting.description || ''}\\n\\nLink: ${meeting.meeting_url || ''}
LOCATION:${meeting.meeting_url || ''}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Lembrete: reunião amanhã
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reunião em 1 hora
END:VALARM
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reunião em 15 minutos
END:VALARM
END:VEVENT
END:VCALENDAR`;
  
  return ics;
};

export const downloadICS = (meeting: Meeting) => {
  const icsContent = generateICS(meeting);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `reuniao-${meeting.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
