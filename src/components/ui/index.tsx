import type { CSSProperties, ReactNode } from "react";
import styles from "./ui.module.css";

export type ColorToken =
  | "surface-100"
  | "surface-200"
  | "surface-300"
  | "surface-peach"
  | "coral"
  | "coral-soft"
  | "sage"
  | "denim"
  | "ochre"
  | "dusty-blue";

export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

const color = (token: ColorToken) => `var(--color-${token})`;

type ShapeKind = "quarter" | "half" | "circle" | "halves-stack" | "halves-row";

type ShapeProps = {
  kind: ShapeKind;
  colors: [ColorToken] | [ColorToken, ColorToken];
  motion?: "spin" | "slide";
  className?: string;
};

/** Плоская фигура-декор; положение и размер задаёт className родителя */
export function Shape({ kind, colors, motion = "spin", className }: ShapeProps) {
  const [a, b = a] = colors;
  const style = { "--shape-a": color(a), "--shape-b": color(b) } as CSSProperties;
  const motionClass = motion === "spin" ? "anim-spin" : "anim-slide";

  return (
    <svg
      aria-hidden="true"
      viewBox={kind === "halves-row" ? "0 0 200 100" : "0 0 100 100"}
      className={cx(styles.shape, motionClass, className)}
      style={style}
    >
      {kind === "quarter" && <path className={styles.fillA} d="M0 0 H100 A100 100 0 0 1 0 100 Z" />}
      {kind === "half" && <path className={styles.fillA} d="M0 100 A50 50 0 0 1 100 100 Z" />}
      {kind === "circle" && <circle className={styles.fillA} cx="50" cy="50" r="50" />}
      {kind === "halves-stack" && (
        <>
          <path className={styles.fillA} d="M0 100 A50 50 0 0 1 100 100 Z" />
          <path className={styles.fillB} d="M0 50 A50 50 0 0 1 100 50 Z" />
        </>
      )}
      {kind === "halves-row" && (
        <>
          <path className={styles.fillA} d="M0 100 A50 50 0 0 1 100 100 Z" />
          <path className={styles.fillB} d="M100 100 A50 50 0 0 1 200 100 Z" />
        </>
      )}
    </svg>
  );
}

type PhotoProps = {
  caption: string;
  tone?: "300" | "200";
  className?: string;
};

/** Плейсхолдер под фотографию, пока нет реальных снимков */
export function Photo({ caption, tone = "300", className }: PhotoProps) {
  return (
    <div
      role="img"
      aria-label={caption}
      className={cx(styles.photo, tone === "200" && styles.photoAlt, className)}
    >
      <span className={styles.photoCaption} aria-hidden="true">
        {caption}
      </span>
    </div>
  );
}

type BadgeProps = {
  tone: "sage" | "coral" | "neutral";
  children: ReactNode;
};

const badgeTone = {
  sage: styles.badgeSage,
  coral: styles.badgeCoral,
  neutral: styles.badgeNeutral,
};

export function Badge({ tone, children }: BadgeProps) {
  return <span className={cx(styles.badge, badgeTone[tone])}>{children}</span>;
}

type PriceProps = {
  value: number;
  unit: string;
  size?: "l" | "m";
};

export function Price({ value, unit, size = "l" }: PriceProps) {
  return (
    <span className={cx(styles.price, size === "m" && styles.priceM)}>
      {value}
      <span className={styles.currency}>{unit}</span>
    </span>
  );
}

export function Logo({ size = "header" }: { size?: "header" | "footer" }) {
  return (
    <span className={cx(styles.logo, size === "footer" && styles.logoFooter)}>
      {"КВАРТА".split("").map((letter, i) => (
        <span key={i} className={i % 2 === 0 ? "heavy" : "thin"}>
          {letter}
        </span>
      ))}
    </span>
  );
}

const WAVES_ID = "kvarta-waves";

/** Пять концентрических «волнистых» контуров, рисуются один раз и переиспользуются через <use> */
export function WavesDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <g id={WAVES_ID}>
          {WAVE_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </defs>
    </svg>
  );
}

export function Waves({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1000 1000" className={cx(styles.waves, className)}>
      <g className={styles.wavesGroup}>
        <use href={`#${WAVES_ID}`} />
      </g>
    </svg>
  );
}

const WAVE_PATHS = [
  "M838.8 500.0C847 518 860 539 859 557C859 575 848 594 835 609C823 624 799 633 784 645C769 656 756 665 747 679C738 693 737 713 730 730C723 747 717 769 704 781C691 792 671 798 653 800C634 801 612 792 595 791C577 791 563 789 547 795C531 801 517 818 500 828C483 837 462 851 444 852C426 853 407 844 392 834C376 823 366 801 353 788C341 775 331 762 315 754C300 746 279 746 261 739C243 732 221 725 209 711C197 698 192 676 191 657C191 638 201 615 204 596C206 578 209 563 205 547C201 531 187 517 179 500C171 483 159 463 158 446C158 428 168 410 178 396C189 381 211 371 223 359C235 346 246 336 253 320C259 304 258 282 263 263C269 245 274 220 287 207C300 194 320 187 339 184C358 182 381 191 400 193C419 194 435 197 451 192C468 188 483 174 500 168C517 161 538 150 555 151C573 153 591 164 605 177C619 190 628 213 639 227C651 241 659 253 674 260C689 268 710 267 728 272C746 278 770 283 783 294C796 306 803 326 807 344C810 362 802 384 802 402C803 420 802 435 808 451C814 468 830 482 839 500Z",
  "M854.8 500.0C863 518 876 540 875 559C874 578 863 598 850 614C838 629 813 639 798 652C783 664 769 674 760 689C750 704 749 724 741 741C734 759 727 782 713 794C700 806 679 812 660 814C641 816 618 807 600 806C581 806 566 805 549 811C533 817 518 834 500 844C482 853 461 867 442 868C423 869 403 860 387 849C371 838 360 816 346 802C333 788 322 776 306 767C290 759 268 758 250 750C231 743 208 735 196 721C184 707 178 684 177 664C176 645 186 620 188 601C191 582 194 566 189 549C185 532 171 518 163 500C155 482 143 462 143 443C143 425 152 406 163 391C174 375 196 365 209 352C221 338 233 327 240 311C247 294 246 272 252 252C258 233 264 208 278 194C291 180 312 173 332 170C351 167 376 176 395 177C415 178 431 181 449 177C466 172 482 158 500 152C518 145 539 134 558 136C576 137 595 149 610 162C625 175 634 198 646 213C659 227 668 239 683 247C699 255 720 255 739 261C758 267 782 272 796 285C810 298 817 318 821 336C825 355 817 378 818 397C818 416 818 431 824 449C830 466 846 482 855 500Z",
  "M870.8 500.0C879 519 892 542 891 562C890 582 879 603 866 619C853 635 828 646 812 659C797 672 782 682 773 698C763 714 761 735 753 753C745 771 737 794 723 807C709 819 687 826 667 828C647 831 624 822 605 822C585 821 569 821 552 827C534 833 519 850 500 860C481 869 459 883 439 884C419 885 398 875 382 864C365 853 353 830 339 816C325 802 313 789 296 780C280 771 257 770 238 762C220 753 196 745 183 730C170 715 165 692 163 672C161 651 172 626 173 606C175 586 178 569 174 552C169 534 155 518 147 500C139 482 127 460 127 441C127 422 137 402 148 386C159 370 181 358 194 344C208 330 219 319 227 302C235 284 234 261 241 241C248 221 254 195 268 181C282 167 304 159 325 156C345 153 370 161 390 162C411 163 428 165 446 161C465 156 481 142 500 136C519 129 541 118 560 120C579 122 599 133 615 147C630 160 641 184 654 198C667 213 677 226 693 234C709 243 731 243 750 250C770 256 795 262 809 276C823 289 831 310 835 329C839 349 832 372 833 392C834 411 833 428 840 446C846 464 862 481 871 500Z",
  "M886.8 500.0C895 520 908 544 907 564C906 585 894 607 881 624C867 641 842 652 827 666C811 680 796 691 785 707C775 724 773 745 764 764C755 783 747 807 732 820C717 833 695 839 674 842C654 845 629 837 609 837C589 837 573 836 554 843C536 849 520 866 500 876C480 885 457 899 437 900C416 900 394 891 377 879C359 868 347 845 332 831C317 816 304 803 287 793C270 784 247 782 227 773C208 764 183 755 170 740C157 724 151 700 149 679C147 658 157 632 158 611C160 590 162 573 158 554C153 536 139 519 131 500C123 481 111 458 111 438C111 419 121 398 133 381C144 364 167 352 180 337C194 322 206 310 214 292C222 274 222 250 230 230C237 209 244 183 259 168C273 153 296 145 317 142C338 138 364 146 385 147C406 148 425 150 444 145C463 140 480 126 500 120C520 113 543 102 563 104C583 106 603 118 620 131C636 145 647 169 661 184C675 199 686 213 702 222C719 231 742 231 762 238C782 246 807 252 822 266C836 280 845 302 849 322C854 342 847 367 848 387C849 407 849 425 856 444C862 463 878 480 887 500Z",
  "M902.8 500.0C911 521 924 545 922 567C921 588 910 611 896 629C882 646 857 659 841 674C825 688 809 700 798 717C788 734 785 756 775 775C766 795 757 819 742 833C726 846 703 853 682 857C660 860 635 852 614 852C594 852 576 852 557 859C538 865 520 882 500 892C480 901 456 915 434 915C413 916 390 906 372 895C353 883 340 860 324 845C309 830 296 816 278 806C260 796 236 794 216 784C196 775 171 765 157 749C144 733 137 708 134 686C132 664 142 638 143 616C144 594 147 576 142 557C137 537 123 520 115 500C107 480 95 457 95 436C96 415 106 393 118 376C129 358 152 345 166 330C180 314 192 301 201 283C210 264 210 240 218 218C226 197 234 170 249 155C265 140 288 131 310 127C332 123 358 131 380 132C402 132 421 134 441 129C461 125 479 110 500 104C521 97 544 86 565 88C586 90 608 103 625 116C642 130 654 155 668 170C683 185 694 199 712 209C729 218 753 219 773 227C793 235 820 242 835 257C850 271 859 294 864 315C869 336 862 361 863 382C864 403 865 422 871 441C878 461 894 479 903 500Z",
];
