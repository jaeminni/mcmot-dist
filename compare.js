const args = require('args-parser')(process.argv);

let origin_path = args['origin'] || '/Users/a10757/works/job/annotation-tool/data/1_origin'
let manual_path = args['manual'] || '/Users/a10757/works/job/annotation-tool/data/2_manual'
let overlap_threshold = args['overlap'] || 0.90

const _fs = require('fs')
const _path = require('path')

if (!origin_path) {
    console.log('need origin path')
    console.log('node', _path.basename(process.argv[1]), '-origin=${origin}', '-manual=${manual}')
    process.exit(-1)
}

if (!manual_path) {
    manual_path = _path.join(origin_path, 'manual')
    origin_path = _path.join(origin_path, 'origin')
}

const ext = /.*\.json/i

function get_files(path, files = []) {
    const stat = _fs.statSync(path)
    if (stat.isDirectory()) {
        const children = _fs.readdirSync(path);
        children.forEach(child => {
            get_files(_path.join(path, child), files)
        })
    } else {
        if (ext.test(path)) {
            files.push(path)
        }
    }

    return files
}


const path_regex = /(?<camera>camera_.*)\/(?<vid>\w+)_(?<rid>\w+)_FRAME_(?<frame>\d+).json/i

function get_path_object(path) {
    const path_object = {}

    const length = origin_path.length + 1
    const files = get_files(path)
    files.forEach(file => {
        const exec = path_regex.exec(file)
        if(exec) {
            const groups = exec.groups
            const key = `${groups['vid']}_${groups['rid']}_${groups['camera']}_${groups['frame']}`
            path_object[key] = file
        }
    })

    return path_object
}

const result = {
    'origin_only': [],
    'manual_only': [],
    'class-null': {
        'origin': [],
        'manual': []
    },
    'geometries': {
        'origin': {
            'count': 0,
            'update': 0,
            'delete': 0
        },
        'manual': {
            'count': 0,
            'create': 0,
            'update': 0,
        }
    },
    'properties': {
        'box': {
            'Horizontal': {origin: 0, manual: 0},
            'Vertical': {origin: 0, manual: 0},
            'Lane-control': {origin: 0, manual: 0}
        },
        'attribute': {
            'Primary': {origin: 0, manual: 0},
            'Far': {origin: 0, manual: 0},
            'Non-facing': {origin: 0, manual: 0},
            'On': {origin: 0, manual: 0},
            'Off': {origin: 0, manual: 0},
            'null': {origin: 0, manual: 0},
        },
        'blobs': {
            'class': {
                'Circle': {origin: 0, manual: 0},
                'Arrow': {origin: 0, manual: 0},
                'Ped': {origin: 0, manual: 0},
                'Bus': {origin: 0, manual: 0},
                'Misc.': {origin: 0, manual: 0},
            },
            'status': {
                'Red': {origin: 0, manual: 0},
                'Green': {origin: 0, manual: 0},
                'Yellow': {origin: 0, manual: 0},
                'Blink': {origin: 0, manual: 0},
                'Blackout': {origin: 0, manual: 0},
                'Unknown': {origin: 0, manual: 0},
            }
        }
    }
}

function area([x1, y1], [x2, y2]) {
    return (x2 - x1) * (y2 - y1)
}

function overlap_geo(origin_geo, manual_geo) {
    const l1 = [Math.round(origin_geo[0][0]), Math.round(origin_geo[0][1])]
        , r1 = [Math.round(origin_geo[2][0]), Math.round(origin_geo[2][1])]
    const l2 = [Math.round(manual_geo[0][0]), Math.round(manual_geo[0][1])]
        , r2 = [Math.round(manual_geo[2][0]), Math.round(manual_geo[2][1])]
    const origin_area = area(l1, r1)
    if (l1[0] > r2[0] || l2[0] > r1[0] || r1[1] < l2[1] || r2[1] < l1[1]) {
        return 0
    }

    const overlap_area = area(
        [Math.max(origin_geo[0][0], manual_geo[0][0]), Math.max(origin_geo[0][1], manual_geo[0][1])],
        [Math.min(origin_geo[2][0], manual_geo[2][0]), Math.min(origin_geo[2][1], manual_geo[2][1])],)

    return Math.sqrt(overlap_area / origin_area)
}


function add_result_properties(object, column) {
    let has_null = false
    const properties = result['properties']
    properties['box'][object['box']][column]++
    properties['attribute'][object['attribute'] ? object['attribute'] : 'null'][column]++
    for (const blob of object['blobs']) {
        const _class = blob['class'];
        if (_class) {
            properties['blobs']['class'][_class][column]++
        } else {
            has_null = true
        }
        const _status = blob['status'];
        properties['blobs']['status'][blob['status']][column]++
    }

    return has_null
}

function add_result_geometry(matrix, origin_len, manual_len) {
    const geometries = result['geometries']
    geometries['origin']['count'] += origin_len
    geometries['manual']['count'] += manual_len

    for (let i = 0; i < origin_len; ++i) {
        let max_overlap = 0
        for (let j = 0; j < manual_len; ++j) {
            max_overlap = Math.max(matrix[i][j], max_overlap)
        }
        if (max_overlap >= overlap_threshold) {
            geometries['origin']['update']++
        } else {
            geometries['origin']['delete']++
        }
    }

    for (let j = 0; j < manual_len; ++j) {
        let max_overlap = 0
        for (let i = 0; i < origin_len; ++i) {
            max_overlap = Math.max(matrix[i][j], max_overlap)
        }
        if (max_overlap >= overlap_threshold) {
            geometries['manual']['update']++
        } else {
            geometries['manual']['create']++
        }
    }
}

function compare_file(origin_file, manual_file) {
    const origin_object = require(origin_file)
    const manual_object = require(manual_file)

    const origin_overhead_objects = origin_object['overhead_objects']
    const manual_overhead_objects = manual_object['overhead_objects']
    const origin_len = origin_overhead_objects.length
    const manual_len = manual_overhead_objects.length

    const matrix = new Array(origin_len)
    for (let i = 0; i < origin_len; ++i) {
        matrix[i] = new Array(manual_len)
    }

    for (let i = 0; i < origin_len; ++i) {
        const origin = origin_overhead_objects[i]
        const origin_geo = origin['geometry']

        for (let j = 0; j < manual_len; ++j) {
            const manual = manual_overhead_objects[j]
            const manual_geo = manual['geometry']
            matrix[i][j] = overlap_geo(origin_geo, manual_geo)
        }
    }

    add_result_geometry(matrix, origin_len, manual_len)

    for (let i = 0; i < origin_len; ++i) {
        const object = origin_overhead_objects[i]
        const has_null = add_result_properties(object, 'origin')
        has_null && result['class-null']['origin'].push(origin_file)
    }
    for (let i = 0; i < manual_len; ++i) {
        const object = manual_overhead_objects[i]
        const has_null = add_result_properties(object, 'manual')
        has_null && result['class-null']['manual'].push(manual_file)
    }

    // console.log(origin_object, manual_object)
}


function print_line(label, object) {
    console.log(label, '\t\t', object['origin'], '\t', object['manual'], '\t', object['manual'] - object['origin'])
}

function print_result() {
    console.log('origin only')
    console.log('--------------------------------------------------------------')
    result['origin_only'].forEach(console.log)
    console.log('--------------------------------------------------------------')
    console.log()
    console.log('manual only')
    console.log('--------------------------------------------------------------')
    result['manual_only'].forEach(console.log)
    console.log('--------------------------------------------------------------')
    console.log()
    console.log('class-null-origin')
    console.log('--------------------------------------------------------------')
    result['class-null']['origin'].forEach(console.log)
    console.log('--------------------------------------------------------------')
    console.log('class-null-manual')
    console.log('--------------------------------------------------------------')
    result['class-null']['manual'].forEach(file => console.log(file))
    console.log('--------------------------------------------------------------')
    console.log()

    const properties = result['properties']

    console.log('                             \t\t origin  manual  diff')
    console.log('--------------------------------------------------------------')
    print_line('             Horizontal  ', properties['box']['Horizontal'])
    print_line('box          Vertical    ', properties['box']['Vertical'])
    print_line('             Lane-control', properties['box']['Lane-control'])
    console.log('--------------------------------------------------------------')
    print_line('             Primary     ', properties['attribute']['Primary'])
    print_line('             Far         ', properties['attribute']['Far'])
    print_line('attribute    Non-facing  ', properties['attribute']['Non-facing'])
    print_line('             On          ', properties['attribute']['On'])
    print_line('             Off         ', properties['attribute']['Off'])
    print_line('             null        ', properties['attribute']['null'])
    console.log('--------------------------------------------------------------')
    const blobs = properties['blobs']
    print_line('             Circle      ', blobs['class']['Circle'])
    print_line('             Arrow       ', blobs['class']['Arrow'])
    print_line('      class  Ped         ', blobs['class']['Ped'])
    print_line('             Bus         ', blobs['class']['Bus'])
    print_line('             Misc.       ', blobs['class']['Misc.'])
    console.log('blobs  -------------------------------------------------------')
    print_line('             Red         ', blobs['status']['Red'])
    print_line('             Green       ', blobs['status']['Green'])
    print_line('             Yellow      ', blobs['status']['Yellow'])
    print_line('      status Blink       ', blobs['status']['Blink'])
    print_line('             Blackout    ', blobs['status']['Blackout'])
    print_line('             Unknown     ', blobs['status']['Unknown'])
    console.log('--------------------------------------------------------------')

    const geometries = result['geometries']
    console.log('Geometry')
    console.log('--------------------------------------------------------------')
    console.log('origin count:', geometries['origin']['count'], `(${geometries['origin']['update'] + geometries['origin']['delete']})`)
    console.log('origin update:', geometries['origin']['update'])
    console.log('origin delete:', geometries['origin']['delete'])
    console.log('--------------------------------------------------------------')
    console.log('manual count:', geometries['manual']['count'], `(${geometries['manual']['update'] + geometries['manual']['create']})`)
    console.log('manual update:', geometries['manual']['update'])
    console.log('manual create:', geometries['manual']['create'])
    console.log('--------------------------------------------------------------')
}

function compare() {
    const origin_files = get_path_object(origin_path)
    const manual_files = get_path_object(manual_path)

    for (const key in origin_files) {
        const origin_file = origin_files[key]
        const manual_file = manual_files[key]

        if (manual_file) {
            delete manual_files[key]
            compare_file(origin_file, manual_file)
        } else {
            result['origin_only'].push(key)
        }
    }
    for (const key in manual_files) {
        result['manual_only'].push(key)
    }

    // console.log(result)
    // console.log(origin_files, manual_files)
    print_result()
}

compare()



