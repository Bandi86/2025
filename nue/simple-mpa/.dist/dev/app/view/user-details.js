
export const lib = [
{
  name: 'user-details',
  tagName: 'section',
  tmpl: '<section class="user"> <media :image="0" :title="1"> <p>:2:</p> </media> <dl :if="3"> <dt>Company</dt> <dd>:4:</dd> <dt>Country</dt> <dd>:5:</dd> <dt>Company size</dt> <dd>:6:</dd> <dt>Website</dt> <dd><a class="action">:7:</a></dd> <dt>Plan</dt> <dd><pill icon="dot" :label="8"></pill></dd> </dl> <media-thumbs :items="9"></media-thumbs> <chat-thread :thread="10"></chat-thread></section>',
  fns: [
    _ => ['/app/icon/cc/',_.cc,'.svg'],
    _ => _.name,
    _ => [_.email],
    _ => _.org,
    _ => [_.org],
    _ => [' ',_.country],
    _ => [_.size.desc,' (',_.size.label,')'],
    _ => [_.website],
    _ => [_.plan],
    _ => _.shots,
    _ => _.thread
  ]
}]
export default lib[0]