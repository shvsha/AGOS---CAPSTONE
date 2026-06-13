from django.db import migrations

BARANGAYS = [
    ("Alipang",          16.237563348508555, 120.48637936638994),
    ("Ambangonan",       16.292460715471893, 120.47254696630522),
    ("Amlang",           16.232497453085085, 120.43466542161482),
    ("Bacani",           16.227960590897286, 120.45908781096342),
    ("Bangar",           16.233168462097932, 120.50676904750539),
    ("Bani",             16.228692313942197, 120.40806646632088),
    ("Benteng-Sapilang", 16.21819520751035,  120.43736327943758),
    ("Cadumanian",       16.26039269741374,  120.46787713615653),
    ("Camp One",         16.22577927235166,  120.50505399696874),
    ("Carunuan East",    16.255406250860535, 120.45979379191249),
    ("Carunuan West",    16.24926800248152,  120.4470866964297),
    ("Casilagan",        16.246289176295925, 120.48937441464953),
    ("Cataguingtingan",  16.218856437099763, 120.45488956809203),
    ("Concepcion",       16.223520531758066, 120.47094021121745),
    ("Damortis",         16.235333285005968, 120.40821970123413),
    ("Gumot-Nagcolaran", 16.20972828736014,  120.44126290490958),
    ("Inabaan Norte",    16.27935310104418,  120.46937538164347),
    ("Inabaan Sur",      16.261125995284832, 120.48248267944999),
    ("Macabiag",         16.22500368189042,  120.42614432607613),
    ("Nagtagaan",        16.231960515743467, 120.42077254190475),
    ("Puzon",            16.20926183980217,  120.48274297369922),
    ("Poblacion West",   16.227638647861806, 120.48095231205696),
    ("Parasapas",        16.282538433938228, 120.44915952159705),
    ("Rabon",            16.210217097047543, 120.4230186691575),
    ("San Jose",         16.277599265755292, 120.48246615780911),
    ("Tabtabungao",      16.21304287483186,  120.46884813326288),
    ("Vila",             16.242923828018533, 120.46385169704709),
]

def seed_barangays(apps, schema_editor):
    Barangay = apps.get_model('barangay', 'Barangay')
    existing = set(Barangay.objects.values_list('barangay_name', flat=True))
    to_create = [
        Barangay(barangay_name=name, latitude=lat, longitude=lng, status='Active')
        for name, lat, lng in BARANGAYS
        if name not in existing
    ]
    if to_create:
        Barangay.objects.bulk_create(to_create)

def unseed_barangays(apps, schema_editor):
    Barangay = apps.get_model('barangay', 'Barangay')
    Barangay.objects.filter(
        barangay_name__in=[name for name, _, _ in BARANGAYS]
    ).delete()

class Migration(migrations.Migration):
    dependencies = [
      ('barangay', '0003_barangay_status'),
  ]

    operations = [
        migrations.RunPython(seed_barangays, unseed_barangays),
    ]