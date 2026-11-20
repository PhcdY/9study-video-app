import { copy } from '@/lib/copy'
import { Card, CardTitle, Page, PageTitle } from '@/components/ui/layout'

const g = copy.guide

/** Huong dan ngan: lam mot video, khi AI hoi, gop y, khi loi, len ban moi. */
export function GuideScreen(): React.JSX.Element {
  return (
    <Page>
      <PageTitle>{g.title}</PageTitle>
      <p className="-mt-3 mb-6 text-[15px] text-phu">{g.lead}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-5">
        {g.sections.map((sec) => (
          <Card key={sec.title} className="flex flex-col gap-3 px-7 py-6">
            <CardTitle>{sec.title}</CardTitle>
            <ol className="m-0 flex flex-col gap-2.5 pl-0">
              {sec.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cham-nhat text-xs font-bold text-cham">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </Page>
  )
}
