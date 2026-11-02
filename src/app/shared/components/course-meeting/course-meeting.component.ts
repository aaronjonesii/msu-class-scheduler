import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CourseMeeting } from "../../interfaces/course-meeting";
import { ScheduleCourseMeeting } from "../../interfaces/schedule-course-meeting";
import { formatDays } from "../../utils/format-course-meetings";
import { formatTimeRange } from "../../utils/format-time";
import { noMeetingTimeLabel } from "../../utils/no-meeting-time-label";

@Component({
  selector: 'csb-course-meeting',
  standalone: true,
  imports: [],
  templateUrl: './course-meeting.component.html',
  styleUrl: './course-meeting.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseMeetingComponent {
  protected readonly formatDays = formatDays;
  protected readonly formatTimeRange = formatTimeRange;

  meeting = input.required<CourseMeeting | ScheduleCourseMeeting>();

  noTimeLabel = computed(() => noMeetingTimeLabel(this.meeting()));

  /** An online meeting's location already stands in for its time. */
  room = computed(() => {
    const { location, meetingTimes } = this.meeting();

    return meetingTimes.length === 0 && location === this.noTimeLabel() ? null : location;
  });
}
